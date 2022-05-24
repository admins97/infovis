import json
from collections import defaultdict

DATAPATH = 'dataset/filtered_dblpv11_after_2010.json'
# FOS_COUNTS = 'fos_counts_in_filtered_dblpv11_after_2010.json'
MUSTCONTAIN = ['id', 'title', 'authors', 'venue', 'fos', 'year', 'n_citation', 'references']
SELECTEDFOS = ['Information security', 'Deep learning',
               'Data security', 'Cloud computing security',
               'Applications of artificial intelligence', 'Biological data', 'Systems biology',
               'Support vector machine', 'Virtual machine', 'Finite-state machine']


if __name__ == '__main__':
    ###################################################### Step 1
    # with open(DATAPATH) as f:
    #     paper_info_lists = json.load(f)['data']
    #
    # fos_filtered_list = []
    # paper_num_datas = defaultdict(lambda: defaultdict(lambda: 0))
    # for each_paper_info_dict in paper_info_lists:
    #     # 2010 ~ 2016년 논문만 남기기
    #     if each_paper_info_dict['year'] > 2016:
    #         continue
    #
    #     # SELECTEDFOS에 있는 fos만 남기기
    #     filtered_fos = []
    #     fos_list = each_paper_info_dict['fos']
    #     for f in fos_list:
    #         if f['name'] in SELECTEDFOS:
    #             filtered_fos.append(f['name'])
    #
    #     # SELECTEDFOS에 있으면 append
    #     if len(filtered_fos) > 0:
    #         processed = {}
    #         for k, v in each_paper_info_dict.items():
    #             if k == 'authors':
    #                 authors = list(map(lambda x: x['name'], v))
    #                 processed[k] = authors
    #             elif k == 'venue':
    #                 processed[k] = v['raw']
    #             elif k == 'fos':
    #                 processed[k] = filtered_fos
    #                 for f in filtered_fos:
    #                     paper_num_datas[f][each_paper_info_dict['year']] += 1
    #             else:
    #                 processed[k] = each_paper_info_dict[k]
    #         fos_filtered_list.append(processed)
    # print("FoS filtering - DONE")
    # with open('fosFiltered.json', 'w') as f:
    #     data = {'data': fos_filtered_list}
    #     json.dump(data, f, indent=2)
    #
    # # postprocess paper num data
    # tendency_data_list = []
    # for fos, years in paper_num_datas.items():
    #     for year, paper_num in years.items():
    #         tendency_data_list.append({
    #             'fos': fos,
    #             'year': year,
    #             'paperNums': paper_num
    #         })
    # with open('filtered_paper_num.json', 'w') as f:
    #     tendency_data = {'data': tendency_data_list}
    #     json.dump(tendency_data, f, indent=2)
    # exit()
    ###############################################################
    with open('fosFiltered.json') as f:
        fos_filtered_list = json.load(f)['data']

    fos_node_id_n_cite_dict = defaultdict(lambda: {})
    node_id_to_data_dicts = {}
    node_id_lists = []
    link_data_lists = []
    for each_paper_info_dict in fos_filtered_list:
        cur_node = each_paper_info_dict['id']
        node_id_lists.append(cur_node)
        node_dict = {
            'id': cur_node,
            'title': each_paper_info_dict['title'],
            'authors': each_paper_info_dict['authors'],
            'fos': each_paper_info_dict['fos'],
            'year': each_paper_info_dict['year'],
            'n_citation': each_paper_info_dict['n_citation'],
            'venue': each_paper_info_dict['venue'],
        }
        node_id_to_data_dicts[cur_node] = node_dict

        for f in each_paper_info_dict['fos']:
            fos_node_id_n_cite_dict[f][cur_node] = each_paper_info_dict['n_citation']

        # {"source": 1, "target": 2, 'value': 3},
        for source_node in each_paper_info_dict['references']:
            link_data_lists.append({
                'source': source_node,
                'target': cur_node
            })
        # paper_num_datas[fos][year] += 1
    print("Generating graph - DONE")

    max_1000_node_id_lists = []
    from itertools import islice
    for k, total in fos_node_id_n_cite_dict.items():
        if len(total) > 1000:
            sorted_ids = {k: v for k, v in sorted(total.items(), key=lambda item: item[1], reverse=True)}
            top_n_ids = list(islice(sorted_ids.keys(), 1000))
            max_1000_node_id_lists.extend(top_n_ids)
        else:
            max_1000_node_id_lists.extend(total.keys())

    fos_to_id_to_title = defaultdict(lambda: {})
    fos_to_title_to_id = defaultdict(lambda: {})
    filtered_links = []
    filtered_nodes = []
    added = defaultdict(lambda: False)
    # paper_num_datas = defaultdict(lambda: defaultdict(lambda: 0))
    for single_link in link_data_lists:
        sid = single_link['source']
        tid = single_link['target']
        # Source target이 다 node에 있고
        if sid in max_1000_node_id_lists and tid in max_1000_node_id_lists:
            filtered_links.append(single_link)
            if not added[sid]:
                node_data = node_id_to_data_dicts[sid]
                filtered_nodes.append(node_data)
                added[sid] = True
                for f in node_data['fos']:
                    fos_to_title_to_id[f][node_data['title']] = sid
                    fos_to_id_to_title[f][sid] = node_data['title']
                    # paper_num_datas[f][node_data['year']] += 1
            if not added[tid]:
                node_data = node_id_to_data_dicts[tid]
                filtered_nodes.append(node_data)
                added[tid] = True
                for f in node_data['fos']:
                    fos_to_title_to_id[f][node_data['title']] = tid
                    fos_to_id_to_title[f][tid] = node_data['title']
                    # paper_num_datas[f][node_data['year']] += 1

    print("Filter nodes and links - DONE")

    with open(f'filtered_graph.json', 'w') as f:
        graph_datas = {
            'nodes': filtered_nodes,
            'links': filtered_links,
            'fos_to_id_to_title': fos_to_id_to_title,
            'fos_to_title_to_id': fos_to_title_to_id,
        }
        json.dump(graph_datas, f, indent=2)